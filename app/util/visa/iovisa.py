#!/usr/bin/env python

import time
import sys
import logging
import readline
from optparse import OptionParser
import visa

try: input = raw_input
except NameError: pass

def main():
    
  

    usage = 'usage: %prog [options] <host>'
    parser = OptionParser(usage=usage)
    parser.add_option('--always-check-esr', action='store_true',
            dest='check_esr',
            help='Check the error status register after every command')

    
    

    (options, args) = parser.parse_args()
    logging.basicConfig()
 

    if len(args) < 1:
        print(parser.format_help())
        sys.exit(1)

    host = args[0]
    rm = visa.ResourceManager()

    # std in    
    while True:
        
        cmd = sys.stdin.readline()


        if cmd == "connect\n":
          
            inst = rm.open_resource( host )
            response = inst.query("*IDN?")
            if response:
                print( response )
                sys.stdout.flush()
            else:
                raise Exception("Cannot find VISA device")
            sys.stdout.flush();

        else:
            print cmd
            sys.stdout.flush();
            is_query = cmd.split(' ')[0][-2]

            try:
                if is_query:
                    if len(cmd) > 1:
                        response = inst.query(cmd)
                        print( response )
                    else:
                        raise Exception("Cannot execute an empty command")
                else:
                    inst.write( cmd ) # Write command to device and do not expect a response
                    print( cmd )

                sys.stdout.flush() # Send message to node

                if options.check_esr:
                    esr = int(inst.ask('*ESR?').strip())
                    if esr != 0:
                        print('Warning: ESR was %d' % esr)
            except Exception:
                e = sys.exc_info()[1]
                print('ERROR: %s' % e)
                sys.stdout.flush()
            
    inst.close()

if __name__ == '__main__':
    main()
