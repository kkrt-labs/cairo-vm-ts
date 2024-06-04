%builtins ecdsa

from starkware.cairo.common.cairo_builtins import SignatureBuiltin

func main{ecdsa_ptr: SignatureBuiltin*}() {
    %{ ecdsa_builtin.add_signature(ids.ecdsa_ptr.address_, (ids.signature_r, ids.signature_s)) %}
    assert ecdsa_ptr.message = 2718;
    assert ecdsa_ptr.pub_key = 1735102664668487605176656616876767369909409133946409161569774794110049207117;

    let ecdsa_ptr = ecdsa_ptr + SignatureBuiltin.SIZE;
    return ();
}
