// Copied from lambdaclass/cairo-vm
func test_error_message() {
    with_attr error_message("Test error") {
        assert 1 = 0;
    }
    return ();
}

func main() {
    test_error_message();
    return ();
}
