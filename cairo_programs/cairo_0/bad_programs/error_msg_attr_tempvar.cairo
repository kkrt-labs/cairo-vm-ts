// Copied from lambdaclass/cairo-vm
func main() {
    tempvar x = 3;
    with_attr error_message("SafeUint256: addition overflow: {x}") {
        assert x = 2;
    }
    return ();
}
