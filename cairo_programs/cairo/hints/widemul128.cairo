fn main() {
    let lhs: felt = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
    let rhs: felt = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;

    let product = lhs * rhs;

    let low = product & ((1 << 128) - 1);  
    let high = product >> 128;             

    return ();
}
