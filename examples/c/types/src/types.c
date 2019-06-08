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

double addFloats(double *x){
//return x;
return 0.01;
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

char * getString() {
  return "It's Alive!!!";
}

char * echoString(char *x) {
  x[0]='a';
  return x;
}
