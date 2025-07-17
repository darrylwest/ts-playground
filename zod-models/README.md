# Zod Models

CLAUDE: This is a Typescript Playground project.

This is a demo typescript application to test data model schemas using zod. 

* There should be an index file that populates the models in various ways and stores the data in maps.
* model definitions are in src/models.ts
* The maps include 
    * const ContactMap z.map(z.string(), z.ContqctSchema());
    * const UserMap = z.map(z.string(), z.UserSchema>());
* The populated models then are to be JSON.stringify'd and witten to disk

The small application should use the jest test framework to create unit tests for the models (no mocks);
Tests should be put in tests folder
The unit tests should also provide test coverage.

Compiled code should go in the dist folder


