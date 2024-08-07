fn main() -> (bool, bool) {
    let a = 10_u32;
    let b = 12_u32;
    (a < b, b < a)
}

fn foo() -> u32 {
    12_u32 ^ 10_u32
}
