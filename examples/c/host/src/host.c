
//define our external functions imported from the host
extern int getInteger(void);
extern char * getString(void);

//get an integer from the host
int echoHostInt() {
  return getInteger();
}

//get a string from the host
char * echoHostString() {
  return getString();
}