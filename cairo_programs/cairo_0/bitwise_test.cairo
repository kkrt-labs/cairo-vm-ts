// Adapted from bitwise_builtin_test.cairo

%builtins bitwise
from starkware.cairo.common.bitwise import bitwise_and, bitwise_xor, bitwise_or, bitwise_operations
from starkware.cairo.common.cairo_builtins import BitwiseBuiltin

func main{bitwise_ptr: BitwiseBuiltin*}() {
    let (and_a) = bitwise_and(12, 10);  // Binary (1100, 1010).
    assert and_a = 8;  // Binary 1000.

    return ();
}
