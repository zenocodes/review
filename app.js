import chalk from 'chalk'
import isEven from 'is-even'

// console.log(chalk.red.bold.bgWhite('app is running'))

for(let i = 1; i <= 10; i++) {
    if(isEven(i)){
        console.log(chalk.green(`${i} is even`))
    } else {
        console.log(chalk.red(`${i} is not even`))
    }
}


/*

    install is-even
    loop through 1 - 10 checking for even numbers, each time
    logging true in green if even, else logging false in red

*/