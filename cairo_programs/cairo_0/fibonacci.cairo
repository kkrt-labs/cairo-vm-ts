func main{}() {
    // Set the counter
    [ap] = 10, ap++;
    // Initialize the Fibonacci sequence with (1, 1).
    [ap] = 1, ap++;
    [ap] = 1, ap++;

    body:
    // Decrease one from the iteration counter.
    [ap] = [ap - 3] - 1, ap++;
    // Copy the last Fibonacci item.
    [ap] = [ap - 2], ap++;
    // Compute the next Fibonacci item.
    [ap] = [ap - 3] + [ap - 4], ap++;
    // If the iteration counter is not zero, jump to body.
    jmp body if [ap - 3] != 0;

    ret;
}
