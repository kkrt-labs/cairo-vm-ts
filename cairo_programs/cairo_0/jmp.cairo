%builtins output

func main{output_ptr: felt*}() {
    jmp test;

    [ap] = 1, ap++;
    jmp rel 6;

    test:
    [ap] = 2, ap++;

    assert [output_ptr] = [ap - 1];
    let output_ptr = output_ptr + 1;
    return ();
}
