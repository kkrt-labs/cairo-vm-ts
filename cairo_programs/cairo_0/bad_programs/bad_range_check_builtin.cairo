%builtins range_check

func main{range_check_ptr: felt*}() {
    assert [range_check_ptr] = -1;
    let range_check_ptr=range_check_ptr + 1;
    return ();
}
