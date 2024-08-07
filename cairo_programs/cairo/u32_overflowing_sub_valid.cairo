use core::num::traits::OverflowingSub;

fn main() -> (u32, bool) {
    12_u32.overflowing_sub(10)
}
