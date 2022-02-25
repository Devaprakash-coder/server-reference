# POS

A webapp for managing inventory and staff management (here we are using it for food industries like hotels and restuarants)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

What things you need to install the software and how to install them

```
1. Download and Install Node js from https://nodejs.org
To check you've properly installed node js, type
node -v in your cmd will return the version of the node js installed in your machine (we are using node js 8.9.4).
2. Install Angular CLI which is used to make it easy to create an application that already works, right out of the box.
3. Dependencies
   3.1 npm install express body-parser --save
   which install and saves the dependencies in your local package.json file
```

### Installing

A step by step series of examples that tell you have to get a development env running

Say what the step will be

```
Give the example
```

And repeat

```
until finished
```

End with an example of getting some data out of the system or using it for a little demo

## Sockets Used
    # for mobile user side
        -- Socket Data (socket_data)
            -- Bills
                * bill_requested ->  on bill requested from mobile user side for socket_data
                * all_bills_confirmed -> when all applied bills get confirmed
                * all_bills_paid -> when all confirmed bills get paid
            -- Orders
                * `order_confirmed`
                * `order_placed`
                * `new_order` order from POS Manager, let mobile user know about their table has order
                * `update_in_order`
    # for Dinamic POS user side 

## Deployment



## Built With

* [Node JS](https://nodejs.org) - Backend
* [Express JS] (https://expressjs.com/) - Node js Framework
* [Angular 4](https://angular.io/) - front end Framework
* [MongoDB](https://rometools.github.io/rome/) - Used for Database


## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Pravinraj Mohan** 
* **Ashok Kumar** 

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone who's code was used
