%builtins ecdsa

from starkware.cairo.common.cairo_builtins import SignatureBuiltin

func main{ecdsa_ptr: SignatureBuiltin*}() {
    let signature_r = 0x6d2e2e00dfceffd6a375db04764da249a5a1534c7584738dfe01cb3944a33ee;
    let signature_s = 0x152d64f9943290feadc803e80b05f5aa36310ee8fe46e623f10f94e33d59f93;
    %{ ecdsa_builtin.add_signature(ids.ecdsa_ptr.address_, (ids.signature_r, ids.signature_s)) %}
    assert ecdsa_ptr.message = 2718;
    assert ecdsa_ptr.pub_key = 0x3d60886c2353d93ec2862e91e23036cd9999a534481166e5a616a983070434d;

    let ecdsa_ptr = ecdsa_ptr + SignatureBuiltin.SIZE;
    return ();
}
