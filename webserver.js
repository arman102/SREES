var http = require('http').createServer(handler); //require http server, and create server with function handler()
var fs = require('fs'); //require filesystem module
var sensorLib = require("node-dht-sensor");
var io = require('socket.io')(http) //require socket.io module and pass the http object (server)
var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
var LED = new Gpio(5, 'out');
var LED1 = new Gpio(6, 'out'); //use GPIO pin 4 as output
var pushButton = new Gpio(17, 'in', 'both'); //use GPIO pin 17 as input, and 'both' button presses, and releases should be handled

http.listen(8080); //listen to port 8080

function handler (req, res) { //create server
  fs.readFile(__dirname + '/public/index.html', function(err, data) { //read file index.html in public folder
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/html'}); //display 404 on error
      return res.end("404 Not Found");
    }
    else
     {
       var sensorResult = sensorLib.read(22, 18);
       res.writeHead(200, {'Content-Type': 'text/html'});
       res.end(build_string(data.toString(), sensorResult.temperature.toFixed(1), sensorResult.humidity.toFixed(1)));
    }
  });
}

io.sockets.on('connection', function (socket) {// WebSocket Connection
  var lightvalue = 0; //static variable for current status
  pushButton.watch(function (err, value) { //Watch for hardware interrupts on pushButton
    if (err) { //if an error
      console.error('There was an error', err); //output error message to console
      return;
    }
    lightvalue = value;
    socket.emit('light', lightvalue); //send button status to client
  });
  socket.on('light', function(data) { //get light switch status from client
    lightvalue = data;
    if (lightvalue != LED.readSync()) { //only change LED if status has changed
      LED.writeSync(lightvalue); //turn LED on or off
    }
  });
});
var lightvalue1 = 0;
 //static variable for current status
io.sockets.on('connection', function (socket) {// WebSocket Connection
  
  pushButton.watch(function (err, value) { //Watch for hardware interrupts on pushButton
    if (err) { //if an error
      console.error('There was an error', err); //output error message to console
      return;
    }
    lightvalue1 = value;
    socket.emit('light1', lightvalue1); //send button status to client
  });
  socket.on('light1', function(data) { //get light switch status from client
    lightvalue1 = data;
    if (lightvalue1 != LED1.readSync()) { //only change LED if status has changed
      LED1.writeSync(lightvalue1); //turn LED on or off
    }
  });
});
 function build_string(html_str, temperature, humidity)
 {
   
   var result_array=[];

   var R = parseInt(255);
   var G = 0;
   var B = 255-R;

   result_array[0]=200;
   result_array[3]="right"

   if (temperature<0)
   {
     result_array[0]=200+(temperature*20);
     result_array[3]="left"
   }

   result_array[1]=20;
   result_array[2]= "rgb(" + R + "," + G + "," + B + ")";
   result_array[4]=22;
   result_array[5]=222*10;
   result_array[6]=222;
   
   
   

   for (i=0; i<result_array.length; i++)
   {
       
       html_str=html_str.replace("{"+i.toString()+"}",          result_array[i].toString());
   }
    return (html_str);
   
 } 
 

process.on('SIGINT', function () { //on ctrl+c
  LED.writeSync(0); // Turn LED off
  LED.unexport(); // Unexport LED GPIO to free resources
  pushButton.unexport(); // Unexport Button GPIO to free resources
  process.exit(); //exit completely
});
