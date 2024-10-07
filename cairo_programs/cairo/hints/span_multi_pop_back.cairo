fn main() {
    let mut span = array![1, 2, 3].span();
    let _ = span.multi_pop_back::<2>();
}