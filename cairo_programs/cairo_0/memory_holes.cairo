// Copied from lambdaclass/cairo-vm
func main() {
    // Deliberately create memory holes
    assert [ap + 5] = 1;
    return ();
}
