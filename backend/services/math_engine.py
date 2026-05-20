"""Controlled math engine: Tokenize -> Normalize -> Evaluate."""

from __future__ import annotations

import math
from dataclasses import dataclass
from enum import Enum, auto
from typing import Any


class MathEngineError(Exception):
    pass


class TokenType(Enum):
    NUMBER = auto()
    IDENT = auto()
    OP = auto()
    LPAREN = auto()
    RPAREN = auto()
    COMMA = auto()
    EOF = auto()


@dataclass
class Token:
    type: TokenType
    value: str
    pos: int


TRIG_FUNCS = frozenset({"sin", "cos", "tan"})
INVERSE_TRIG = frozenset({"asin", "acos", "atan"})

UNICODE_MAP = {
    "×": "*",
    "÷": "/",
    "−": "-",
    "–": "-",
    "—": "-",
    "π": "pi",
    "ℯ": "e",
    "^": "**",
}


class MathEngine:
    def __init__(self) -> None:
        self._angle_mode = "deg"

    def evaluate(
        self,
        expression: str,
        *,
        angle_mode: str = "deg",
        precision: int = 12,
    ) -> float:
        self._angle_mode = angle_mode if angle_mode in ("deg", "rad") else "deg"
        expr = expression.strip()
        if not expr:
            raise MathEngineError("Expression is empty")
        tokens = self._tokenize(expr)
        normalized = self._normalize(tokens)
        result = self._evaluate_tokens(normalized)
        if not math.isfinite(result):
            raise MathEngineError("Result is not a finite number")
        return round(result, precision)

    def _tokenize(self, expr: str) -> list[Token]:
        tokens: list[Token] = []
        i = 0
        n = len(expr)
        while i < n:
            ch = expr[i]
            if ch.isspace():
                i += 1
                continue
            if ch.isdigit() or (ch == "." and i + 1 < n and expr[i + 1].isdigit()):
                start = i
                i += 1
                while i < n and (expr[i].isdigit() or expr[i] == "."):
                    i += 1
                tokens.append(Token(TokenType.NUMBER, expr[start:i], start))
                continue
            if ch.isalpha() or ch == "_":
                start = i
                i += 1
                while i < n and (expr[i].isalnum() or expr[i] == "_"):
                    i += 1
                tokens.append(Token(TokenType.IDENT, expr[start:i].lower(), start))
                continue
            if ch in "+-*/%^(),":
                if ch == "(":
                    ttype = TokenType.LPAREN
                elif ch == ")":
                    ttype = TokenType.RPAREN
                elif ch == ",":
                    ttype = TokenType.COMMA
                else:
                    ttype = TokenType.OP
                tokens.append(Token(ttype, ch, i))
                i += 1
                continue
            if ch in UNICODE_MAP:
                mapped = UNICODE_MAP[ch]
                if mapped in ("pi", "e"):
                    tokens.append(Token(TokenType.IDENT, mapped, i))
                else:
                    tokens.append(Token(TokenType.OP, mapped, i))
                i += 1
                continue
            raise MathEngineError(f"Invalid character '{ch}' at position {i}")
        tokens.append(Token(TokenType.EOF, "", n))
        return tokens

    def _normalize(self, tokens: list[Token]) -> list[Token]:
        out: list[Token] = []
        prev: Token | None = None
        for tok in tokens:
            if tok.type == TokenType.EOF:
                out.append(tok)
                break
            if tok.type == TokenType.IDENT and tok.value == "ln":
                tok = Token(TokenType.IDENT, "log_nat", tok.pos)
            if tok.type == TokenType.OP and tok.value == "^":
                tok = Token(TokenType.OP, "**", tok.pos)
            if (
                tok.type == TokenType.OP
                and tok.value == "-"
                and (
                    prev is None
                    or prev.type in (TokenType.OP, TokenType.LPAREN, TokenType.COMMA)
                )
            ):
                out.append(Token(TokenType.NUMBER, "0", tok.pos))
            if prev and self._needs_implicit_mult(prev, tok):
                out.append(Token(TokenType.OP, "*", tok.pos))
            out.append(tok)
            prev = tok
        return out

    def _needs_implicit_mult(self, prev: Token, curr: Token) -> bool:
        if prev.type == TokenType.RPAREN and curr.type in (
            TokenType.IDENT,
            TokenType.NUMBER,
            TokenType.LPAREN,
        ):
            return True
        if prev.type == TokenType.NUMBER and curr.type in (
            TokenType.IDENT,
            TokenType.LPAREN,
        ):
            return True
        if prev.type == TokenType.IDENT and curr.type == TokenType.LPAREN:
            return False
        if prev.type == TokenType.IDENT and curr.type in (
            TokenType.NUMBER,
            TokenType.IDENT,
        ):
            return True
        return False

    def _evaluate_tokens(self, tokens: list[Token]) -> float:
        self._tokens = tokens
        self._pos = 0
        val = self._parse_expression()
        if self._current().type != TokenType.EOF:
            raise MathEngineError("Unexpected tokens after expression")
        return val

    def _current(self) -> Token:
        return self._tokens[self._pos]

    def _advance(self) -> Token:
        tok = self._current()
        if tok.type != TokenType.EOF:
            self._pos += 1
        return tok

    def _parse_expression(self) -> float:
        return self._parse_additive()

    def _parse_additive(self) -> float:
        left = self._parse_multiplicative()
        while self._current().type == TokenType.OP and self._current().value in "+-":
            op = self._advance().value
            right = self._parse_multiplicative()
            left = left + right if op == "+" else left - right
        return left

    def _parse_multiplicative(self) -> float:
        left = self._parse_power()
        while self._current().type == TokenType.OP and self._current().value in "*/%":
            op = self._advance().value
            right = self._parse_power()
            if op == "*":
                left *= right
            elif op == "/":
                if right == 0:
                    raise MathEngineError("Division by zero")
                left /= right
            else:
                left %= right
        return left

    def _parse_power(self) -> float:
        left = self._parse_unary()
        if self._current().type == TokenType.OP and self._current().value == "**":
            self._advance()
            right = self._parse_power()
            return left**right
        return left

    def _parse_unary(self) -> float:
        if self._current().type == TokenType.OP and self._current().value == "+":
            self._advance()
            return self._parse_unary()
        if self._current().type == TokenType.OP and self._current().value == "-":
            self._advance()
            return -self._parse_unary()
        return self._parse_postfix()

    def _parse_postfix(self) -> float:
        val = self._parse_primary()
        if self._current().type == TokenType.OP and self._current().value == "!":
            self._advance()
            if val < 0 or val != int(val):
                raise MathEngineError("Factorial requires non-negative integer")
            return float(math.factorial(int(val)))
        return val

    def _parse_primary(self) -> float:
        tok = self._current()
        if tok.type == TokenType.NUMBER:
            self._advance()
            return float(tok.value)
        if tok.type == TokenType.IDENT:
            return self._parse_function_or_constant()
        if tok.type == TokenType.LPAREN:
            self._advance()
            val = self._parse_expression()
            if self._current().type != TokenType.RPAREN:
                raise MathEngineError("Missing closing parenthesis")
            self._advance()
            return val
        raise MathEngineError(f"Unexpected token: {tok.value}")

    def _parse_function_or_constant(self) -> float:
        name = self._advance().value
        if name == "pi":
            return math.pi
        if name == "e":
            return math.e
        if self._current().type != TokenType.LPAREN:
            raise MathEngineError(f"Expected '(' after '{name}'")
        self._advance()
        args: list[float] = []
        if self._current().type != TokenType.RPAREN:
            args.append(self._parse_expression())
            while self._current().type == TokenType.COMMA:
                self._advance()
                args.append(self._parse_expression())
        if self._current().type != TokenType.RPAREN:
            raise MathEngineError("Missing closing parenthesis in function call")
        self._advance()
        return self._call_function(name, args)

    def _call_function(self, name: str, args: list[float]) -> float:
        deg = self._angle_mode == "deg"

        if name in TRIG_FUNCS:
            if len(args) != 1:
                raise MathEngineError(f"{name} requires one argument")
            x = math.radians(args[0]) if deg else args[0]
            return float({"sin": math.sin, "cos": math.cos, "tan": math.tan}[name](x))

        if name in INVERSE_TRIG:
            if len(args) != 1:
                raise MathEngineError(f"{name} requires one argument")
            result = float(
                {"asin": math.asin, "acos": math.acos, "atan": math.atan}[name](args[0])
            )
            return math.degrees(result) if deg else result

        unary: dict[str, Any] = {
            "sqrt": math.sqrt,
            "abs": abs,
            "log_nat": math.log,
            "log": math.log10,
            "rad": math.radians,
            "deg": math.degrees,
            "exp": math.exp,
            "floor": math.floor,
            "ceil": math.ceil,
        }
        if name in unary and len(args) == 1:
            if name == "sqrt" and args[0] < 0:
                raise MathEngineError("Cannot take square root of negative number")
            try:
                return float(unary[name](args[0]))
            except (ValueError, OverflowError) as e:
                raise MathEngineError(str(e)) from e

        if name == "pow" and len(args) == 2:
            return args[0] ** args[1]

        if name == "mod" and len(args) == 2:
            if args[1] == 0:
                raise MathEngineError("Modulo by zero")
            return float(args[0] % args[1])

        raise MathEngineError(f"Unknown function: {name}")


_engine = MathEngine()


def get_engine() -> MathEngine:
    return _engine
