// Copied from lambdaclass/cairo-vm
%builtins output

from starkware.cairo.common.serialize import serialize_word

func return_10() -> (res: felt) {
    let res = 10;
    return (res,);
}

func main{output_ptr: felt*}() {
    let (value) = return_10();

    serialize_word(value);

    return ();
}
