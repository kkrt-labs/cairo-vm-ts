func main() {
    fib(0, 1, 40000);

    ret;
}

func fib(first_element, second_element, n) -> (res: felt) {
    if (n == 0) {
        return (first_element,);
    }

    let y = first_element + second_element;
    return fib(second_element, y, n - 1);
}
