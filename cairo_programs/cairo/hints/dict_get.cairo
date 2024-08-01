fn main() {
    let mut balances: Felt252Dict<u64> = Default::default();
    balances.insert('Simon', 100);
    balances.get('Simon');
}
