// Taken from lambda-class/cairo-vm repo

%builtins bitwise
from starkware.cairo.common.bitwise import bitwise_and, bitwise_xor, bitwise_or, bitwise_operations
from starkware.cairo.common.cairo_builtins import BitwiseBuiltin

func main{bitwise_ptr: BitwiseBuiltin*}(x: felt, y: felt) {

    assert bitwise_ptr.x = x;
    assert bitwise_ptr.y = y;
    tempvar and = bitwise_ptr.and

    return ();
}
