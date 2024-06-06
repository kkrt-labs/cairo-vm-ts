%builtins bitwise

from starkware.cairo.common.bitwise import bitwise_and, bitwise_xor, bitwise_or, bitwise_operations
from starkware.cairo.common.cairo_builtins import BitwiseBuiltin

func main{bitwise_ptr: BitwiseBuiltin*}() {

    assert bitwise_ptr.x = 12; // Binary 1100
    assert bitwise_ptr.y = 10; // Binary 1010
    assert bitwise_ptr.x_and_y = 8; // Binary 1000
    assert bitwise_ptr.x_xor_y = 6; // Binary 0110
    assert bitwise_ptr.x_or_y = 14; // Binary 1110

    let bitwise_ptr = bitwise_ptr + BitwiseBuiltin.SIZE;

    return ();
}
