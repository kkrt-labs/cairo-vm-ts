%builtins output bitwise

from starkware.cairo.common.bitwise import bitwise_and
from starkware.cairo.common.cairo_builtins import BitwiseBuiltin

func main{output_ptr: felt*, bitwise_ptr: BitwiseBuiltin*}() {
    let (result) = bitwise_and(1, 2);
    assert [output_ptr] = result;
    let output_ptr = output_ptr + 1;
    return ();
}
