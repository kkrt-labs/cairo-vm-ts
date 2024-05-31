%builtins pedersen

from starkware.cairo.common.cairo_builtins import HashBuiltin

func main{pedersen_ptr: HashBuiltin*}() {
    assert pedersen_ptr.x = 0;
    assert pedersen_ptr.y = 0;
    assert pedersen_ptr.result = 0x49ee3eba8c1600700ee1b87eb599f16716b0b1022947733551fde4050ca6804;
    let pedersen_ptr = pedersen_ptr + HashBuiltin.SIZE;

    assert pedersen_ptr.x = 0;
    assert pedersen_ptr.y = 1;
    assert pedersen_ptr.result = 0x46c9aeb066cc2f41c7124af30514f9e607137fbac950524f5fdace5788f9d43;
    let pedersen_ptr = pedersen_ptr + HashBuiltin.SIZE;

    assert pedersen_ptr.x = 1;
    assert pedersen_ptr.y = 0;
    assert pedersen_ptr.result = 0x268a9d47dde48af4b6e2c33932ed1c13adec25555abaa837c376af4ea2f8a94;
    let pedersen_ptr = pedersen_ptr + HashBuiltin.SIZE;

    assert pedersen_ptr.x = 54;
    assert pedersen_ptr.y = 1249832432;
    assert pedersen_ptr.result = 0x20120a7d08fd21654c72a9281841406543b16d00faaca1069332053c41c07b8;
    let pedersen_ptr = pedersen_ptr + HashBuiltin.SIZE;

    return ();
}
