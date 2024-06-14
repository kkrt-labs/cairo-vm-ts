%builtins keccak

from starkware.cairo.common.cairo_builtins import KeccakBuiltin
from starkware.cairo.common.keccak_state import KeccakBuiltinState

func main{keccak_ptr: KeccakBuiltin*}() {
    assert keccak_ptr[0].input = KeccakBuiltinState(0, 0, 0, 0, 0, 0, 0, 0);
    let result = keccak_ptr[0].output;
    assert result.s0 = 0x4dd598261ea65aa9ee84d5ccf933c0478af1258f7940e1dde7;
    assert result.s1 = 0x47c4ff97a42d7f8e6fd48b284e056253d057bd1547306f8049;
    assert result.s2 = 0x8ffc64ad30a6f71b19059c8c5bda0cd6192e7690fee5a0a446;
    assert result.s3 = 0xdbcf555fa9a6e6260d712103eb5aa93f2317d63530935ab7d0;
    assert result.s4 = 0x5a21d9ae6101f22f1a11a5569f43b831cd0347c82681a57c16;
    assert result.s5 = 0x5a554fd00ecb613670957bc4661164befef28cc970f205e563;
    assert result.s6 = 0x41f924a2c509e4940c7922ae3a26148c3ee88a1ccf32c8b87c;
    assert result.s7 = 0xeaf1ff7b5ceca24975f644e97f30a13b16f53526e70465c218;
    let keccak_ptr = keccak_ptr + KeccakBuiltin.SIZE;
    return ();
}
