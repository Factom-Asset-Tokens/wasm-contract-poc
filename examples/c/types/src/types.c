#include <stdlib.h>
#include <string.h>
#include <emscripten.h>


/*

Integers

*/
int getTen(){
  return 10;
}

int add(int x, int y){
  return x + y;
}

int mult(int x, int y){
  return x * y;
}

/*

Floating Points

NOTE: You must use the double return type to get expected return precision calling from JS
Otherwise you will get something like  10.010000228881836.... which is no good

*/

double getTenPointZeroOne(){
  return 10.01;
}

float addFloats(float x, float y){
return x + y;
}

/*

Booleans

*/

int getTrue(){
  return 1;
}

int getFalse(){
  return 0;
}

int echoBoolean(int x){
  return x;
}

int negate(int x){
  return !x;
}

int or(int x,int y){
  return x | y;
}

/*

Strings

*/


//define a place in memory for string input from the host program
char inStr[20];

//get the offset in memory of the start of the string input pointer
char* getInStrOffset () {
  return &inStr[0];
}


char * getString() {
  return "It's Alive!!!";
}

char * echoString() {
  //inStr contains our parameter
  inStr[0]='a';

  char str[] = "Your String Was: ";

  return inStr;
}

char * echoStringParam(char *x) {
  return x;
}