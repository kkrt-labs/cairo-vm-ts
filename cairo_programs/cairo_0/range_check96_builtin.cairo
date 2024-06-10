%builtins range_check96

func main{range_check96_ptr: felt*}() {
    assert [range_check96_ptr] = 2 ** 96 - 1;
    let range_check96_ptr = range_check96_ptr + 1;
    return ();
}
