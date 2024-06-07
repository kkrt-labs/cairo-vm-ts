%builtins keccak

from starkware.cairo.common.cairo_builtins import KeccakBuiltin
from starkware.cairo.common.keccak_state import KeccakBuiltinState

func main{keccak_ptr: KeccakBuiltin*}() {
    assert keccak_ptr[0].input = KeccakBuiltinState(1, 2, 3, 4, 5, 6, 7, 8);
    let result = keccak_ptr[0].output;
    assert result.s0 = 0x5437ca4807beb9df3871c8467f0c8c2ac42e1f2100e18198f6;
    assert result.s1 = 0x7a753f70755cbbde7882962e5969b2874c2dff11a91716ab31;
    assert result.s2 = 0xe561082c7d6621e7480f773a54870b0dab0ad6151b08ee303a;
    assert result.s3 = 0xb744cd390af9518a46a3d88b6003f7393c7ead3f9a131638be;
    assert result.s4 = 0xf16079da5c848e9f6b99afdf72720169e5209e171f8ef7582e;
    assert result.s5 = 0xe108fbbcea9d86a6d76f01b63c33ffffd896ad8e2b71026060;
    assert result.s6 = 0x9c7aa8a62187936713012ec096925a78b1c1a140ab7a061ca3;
    assert result.s7 = 0xd5774bd1793a6b3940c0a54888a6a3c1e57251a7e727590b40;
    let keccak_ptr = keccak_ptr + KeccakBuiltin.SIZE;
    return ();
}
