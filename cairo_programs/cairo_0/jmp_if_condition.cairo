// Copied from lambdaclass/cairo-vm
func foo(n) -> (r: felt) {
    alloc_locals;
    local x;

    jmp body if n != 0;
    [ap] = 0, ap++;
    ret;

    body:
    [ap] = 1, ap++;
    ret;
}

func main() {
    foo(n=0);
    ret;
}
