 
// Include the required libraries
#include <CmdMessenger.h>
#include <DueTimer.h>

// Mustnt conflict / collide with our message payload data. Fine if we use base64 library ^^ above
char field_separator = ',';
char command_separator = ';';

// Attach a new CmdMessenger object to the USB Data Serial port
CmdMessenger cmdMessenger = CmdMessenger(SerialUSB, field_separator, command_separator);

unsigned long previousToggleLed = 0;   // Last time the led was toggled
bool ledState                   = 0;   // Current state of Led
const int kBlinkLed             = 13;  // Pin of internal Led


// ------------------ C M D L I S T I N G ( T X / R X ) ---------------------

// We can define up to a default of 50 cmds total, including both directions (send + recieve)
// and including also the first 4 default command codes for the generic error handling.
// If you run out of message slots, then just increase the value of MAXCALLBACKS in CmdMessenger.h

// Commands we send from the Arduino to be received on the PC
enum
{
  kCOMM_ERROR = 000,    // Lets Arduino report serial port comm error back to the PC (only works for some comm errors)
  kACK = 001,           // Arduino acknowledges cmd was received
  kARDUINO_READY = 002, // After opening the comm port, send this cmd 02 from PC to check arduino is ready
  kERR = 003,           // Arduino reports badly formatted cmd, or cmd not recognised
  kANSWER = 004,
  // For the above commands, we just call cmdMessenger.sendCmd() anywhere we want in our Arduino program.
  kSEND_CMDS_END,       // Mustnt delete this line
};

// Commands we send from the PC and want to recieve on the Arduino.
// We must define a callback function in our Arduino program for each entry in the list below vv.
// They start at the address kSEND_CMDS_END defined ^^ above as 004
messengerCallbackFunction messengerCallbacks[] =
{
  setDigitalPin, // Command 5
  readDigitalPin, // Command 6
  readAnalogPin, // Command 7
  deviceOn, // Command 8
};

// Set cmdMessage general methods
void arduino_ready() {
  Serial.print("Arduino is ready and running");
  cmdMessenger.sendCmd(kACK,"Arduino ready"); // Sends command 001
}

void unknownCmd() {
  Serial.print("Unknown command");
  cmdMessenger.sendCmd(kERR,"Unknown command"); // Sends command 003
}

// Attached callbacks to command messenger
void attach_callbacks(messengerCallbackFunction* callbacks)
{
  int i = 0;
  int offset = kSEND_CMDS_END;
  while(callbacks[i])
  {
    cmdMessenger.attach(offset+i, callbacks[i]);
    i++;
  }
}

#define TIME_RTC 300000                            // Temps du RTC en us-> 500ms



/**
 *  Sets a digital pin
 *  @param {Int16} Pin number
 *  @param {Boolean} LowHigh
 */
void setDigitalPin()  
{
  int counter;
  long value;
  int PinOut;  // this should only be certain pins
  int LowHigh;

  PinOut = cmdMessenger.readInt16Arg();
  LowHigh = cmdMessenger.readBoolArg();
  Serial.println( PinOut );
  Serial.println( LowHigh );
    
    if ( ( PinOut > 2 && PinOut < 14 ) || ( PinOut > 21 && PinOut < 54 ) ) {
      
      if (LowHigh == 0) {
        digitalWrite(PinOut, LOW);
      } else {
        digitalWrite(PinOut, HIGH);
      }
      
    } else {
      cmdMessenger.sendCmd(kERR,"Cannot set this pin digitally");
      return;
    }  
      
    String response = "";
    response += "Pin number ";
    response += String( PinOut );
    response += ";Value: ";
    response += String( LowHigh );
   
    cmdMessenger.sendCmd( kANSWER, response );
}


/**
 *  Reads a digital pin
 *  @param {Int16} Pin number
 *  @param {Boolean} LowHigh
 */
void readDigitalPin()  // this function reads the value on an Analog In pin
{
  int PinIn;  // this should only be certain pins
  int PinValue;
 
  PinIn = cmdMessenger.readInt16Arg();

  if ( ( PinIn > 2 && PinIn < 14 ) || ( PinIn > 21 && PinIn < 54 ) ) {
      
    PinValue = digitalRead( PinIn );
    
  } else {
    cmdMessenger.sendCmd(kERR,"Cannot read this pin digitally");
    return;
  }
   
  cmdMessenger.sendCmdStart(kANSWER);
  cmdMessenger.sendCmdArg(PinValue);
  cmdMessenger.sendCmdEnd();
  
  
}

void readAnalogPin()
{
  
  int analogPin = cmdMessenger.readInt16Arg();
  long PinValue;
  
  if ( ( analogPin >= 0 && analogPin < 12 ) ) {
      
    analogPin = analogRead( analogPin );
    analogPin = map(PinValue, 0, 4095, 0, 3.3);   // map it to the range of the analog out:

  } else {
    cmdMessenger.sendCmd(kERR,"Cannot read this analog pin");
    return;
  }  
  

  cmdMessenger.sendCmdStart(kANSWER);
  cmdMessenger.sendCmdArg(PinValue);
  cmdMessenger.sendCmdEnd();
}



// ----- DEVICE METHODS

int devicePins[] = { 53, 51, 49, 47, 45, 43, 41, 39 };

void deviceOn( ) {
  Serial.print("Device on?");
 
  Serial.print("Turn on device number:");

  int deviceNumber = cmdMessenger.readInt16Arg();
  Serial.print( deviceNumber );
  devicesOff();

 _deviceOn( deviceNumber );
  cmdMessenger.sendCmdStart(kANSWER);
  cmdMessenger.sendCmdArg( deviceNumber );
  cmdMessenger.sendCmdEnd();
}

void _deviceOn( int deviceNumber ) {
  if( devicePins[ deviceNumber ] ) {
     digitalWrite( devicePins[ deviceNumber ], HIGH );
  }
}


void devicesOff() {
  int i = 0;
  Serial.print("Of all");

  for( i = 0; i < 8; i = i + 1 ) {
    Serial.print( devicePins[ i ] );
    digitalWrite( devicePins[ i ], LOW );
  }
  
}

// ----- DEVICE METHODS


void setup()
{
  int i;
  // Listen on serial connection for messages from the pc
  Serial.begin(9600); // Arduino Uno, Mega, with AT8u2 USB
  
  SerialUSB.begin(115200); 

  
  for( i = 0; i < 8; i = i + 1 ) {
    Serial.print(devicePins[ i ]);
    pinMode(devicePins[ i ], OUTPUT);
    digitalWrite( devicePins[ i ], LOW );
  }
  
 
  // cmdMessenger.discard_LF_CR(); // Useful if your terminal appends CR/LF, and you wish to remove them
  cmdMessenger.printLfCr(); // Make output more readable whilst debugging in Arduino Serial Monitor
  
  // Attach default / generic callback methods
  cmdMessenger.attach(kARDUINO_READY, arduino_ready);
  cmdMessenger.attach(unknownCmd);
  // Attach my application's user-defined callback methods
  attach_callbacks(messengerCallbacks);

  arduino_ready();  

  // Set up ADC/DAC
  analogWriteResolution( 12 );
  analogReadResolution( 12 ); 
}
    
// ------------------ M A I N ( ) --------------------------------------------

// Timeout handling
long timeoutInterval = 2000; // 2 seconds
long previousMillis = 0;
int counter = 0;

void timeout()
{
  // blink
  if (counter % 2)
    digitalWrite(13, HIGH);
  else
    digitalWrite(13, LOW);
  counter ++;
}

void loop()
{
  // Process incoming serial data, if any
  cmdMessenger.feedinSerialData();
  // Toggle LED periodically. If the LED does not toggle every 2000 ms, 
  // this means that cmdMessenger are taking a longer time than this  
  if (hasExpired(previousToggleLed,2000)) // Toggle every 2 secs
  {
    toggleLed();  
  } 
}

// Returns if it has been more than interval (in ms) ago. Used for periodic actions
bool hasExpired(unsigned long &prevTime, unsigned long interval) {
  if (  millis() - prevTime > interval ) {
    prevTime = millis();
    return true;
  } else     
    return false;
}

// Toggle led state 
void toggleLed()
{  
  Serial.print("toggle");
  ledState = !ledState;
  digitalWrite(kBlinkLed, ledState?HIGH:LOW);
}  

