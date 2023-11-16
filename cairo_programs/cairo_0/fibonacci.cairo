func fibonacci(n : felt) -> (result : felt){
  alloc_locals;
  if (n == 0){
    return (result=0);
  }
  if (n == 1){
    return (result=1);
  }
  let (local x) = fibonacci(n - 1);
  let (local y) = fibonacci(n - 2);
  return (result= x + y);
}

func main{}() {
    let (fib) = fibonacci(10);
    return();
}
