use core::num::traits::OverflowingSub;

fn main() -> (u32, bool) {
    10_u32.overflowing_sub(12)
}
