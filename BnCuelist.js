
outlets = 2;

var alllines=[];
var cueindex=[];
var cueNameList=[];




// readfile and load cues
function readfile(s)
{
	alllines=[];
	cueindex=[];
	cueNameList=[];
	var f = new File(s);
	var i,line,c;

	if (f.isopen) {
		i=0;
		while ((line = f.readline()) != null) {//returns a string
			lineArray=convertToNiceArray(line);
			
			
			alllines.push(lineArray);
			if (lineArray[0]=="cue"){
				cueindex.push(i);
				cueNameList.push(lineArray.slice(1).toString());
			}
			i++;
			
		}
		f.close();
	getcues();
	} else {
		post("could not open file: " + s + "\n");
	}
}



// convert an String  (here a line of the txt) an array where numbers are number anto a max message, -> no double spaces, no space at bigining, no space at end, convert "string" numbers to numbers
function convertToNiceArray(stringMessage){
	stringMessage=stringMessage.split(",").join(" , ")	// insert spaces around ALL comas to insure that they get process correctly afterwords (kind of dirty way of doing it...)
	while(stringMessage.indexOf("  ")!=-1){stringMessage=stringMessage.replace("  ", " ");}	//removing preceding " "
	while(stringMessage[0]==" "){stringMessage=stringMessage.substr(1);} 					// replace multiple spaces with a single space
	while(stringMessage[stringMessage.length-1]==" "){stringMessage=stringMessage.substr(0,stringMessage.length-1);}// remove trailing " "
		

	if(stringMessage==""){niceArray=[]}
	else{
		// split string at " ", make an array,
		arrayMessage=stringMessage.split(" ");
		niceArray=[];
		// for each element, check if element is a number, if so convert it to a number
		for(i=0;i<arrayMessage.length; i++){
		if (Number(arrayMessage[i])!=Number(arrayMessage[i])){niceArray[i]=arrayMessage[i]}
			else{niceArray[i]=Number(arrayMessage[i])}
		}
	}
	while(niceArray[niceArray.length- 1]==","){niceArray.pop()} // remove any comas at the end of the line
	while(niceArray[niceArray.length- 1]==";"){niceArray.pop()} // remove any semi colon at the end of the line
	return niceArray;
}



// output list of cues out 2nd inlet to populate umenu
function getcues()
{
	outlet(1, "clear");
	if(cueindex.length==0){
		post("no defined cues")
	}
	else {
		for(i=0; i<cueindex.length; i++){
				
				cuenameI="";
				for(y in alllines[cueindex[i]]){
					if(y==0){}
					else cuenameI=cuenameI.concat(alllines[cueindex[i]][y], " ");
				}
				
			outlet(1, "append" , cuenameI );
		}	
	}
	outlet(0, "cuecount", cueindex.length);
	outlet(0, "cuelist_ready");
}







//get line,  actually not used...
function getline(y)
{
	outlet(0, alllines[y]);
	post(alllines[y] + "\n");
}

// get index of commas "," in array
function indexOfComma(arr){
	idxc=[]
	for(z=0;z<arr.length;z++){
		if(arr[z]==","){idxc.push(z)}
	}
	return idxc;
}



//send a full line
function sendLine(fullLine){
	comas=indexOfComma(fullLine)
	if(comas.length==0){
		messnamed(fullLine[0], fullLine.slice(1))
//	send line
	}
	else{
		for(t=0;t<comas.length+1;t++){
			if(t==0){
			tosend=fullLine.slice(1,comas[0])
			//send that
			}
			else if(t==comas.length){
			tosend=fullLine.slice(comas[t- 1]+1)
			//send that
			}			
			else{
			tosend=fullLine.slice(comas[t- 1]+1,comas[t])
			//send that
			}
			if(tosend!=undefined){messnamed(fullLine[0], tosend)}
		}	
	}
}



// output cue nbr n
function msg_int(n)
{
	if(n<0 || n>=cueindex.length){
		post("no cue " + n + "\n")
		return;
	}
	
	//canb make cues base 1 by doing n+1 here
	cuelines=alllines.slice(cueindex[n]+1);
	outlet(0, "cue", n);
	for (i=0; i<cuelines.length; i++){ 
		if(cuelines[i][0]=="cue"){break;}
			else if (cuelines[i].length==0){}	// empty line , ignore it
			else if (typeof(cuelines[i][0])=="number"){ // if line starts with number, delay it
				delayedSendLine(cuelines[i])
				outlet(0, "delayed_message", cuelines[i])
			} 
			else if (cuelines[i][0].substring(0,2).match("//")){	// line starts with "//", ignore it, it's a comment
			outlet(0, "comment", cuelines[i])
			}
			else {													//other lines -> send it
				outlet(0, "sent_message", cuelines[i]);
				sendLine(cuelines[i]);	
			}
	}
	
}


//trigger cue from message : cue [CUENAME]	
function cue(inputName){
	if(inputName[0]!=null){
		a=cueNameList.indexOf(inputName.toString());	
		//post(a);
		if(a!=-1){
			msg_int(a);
		}
	}
}








//handle Delayed lines

var ftasks=[];
var number_of_pending_tasks = 0;



//clear delayed messages
function clear ()
{
    for (var i=0;i<ftasks.length;i++)
    {
        if (ftasks[i]!=undefined)
        {
            ftasks[i].cancel(); 
        }
    }
    ftasks=[];
}



function delayedSendLine_SUB(args)
{
    if (args[0]!=undefined){
		//finally send line
    	sendLine(args)}
    	number_of_pending_tasks--;
    if (number_of_pending_tasks==0){
        ftasks=[];}
}

function delayedSendLine(toBeDelayed)
{
    delay = toBeDelayed[0];
    mess = toBeDelayed.slice(1);
    delayed_execution_task = new Task(delayedSendLine_SUB,this,mess);
    ftasks.push(delayed_execution_task);
    number_of_pending_tasks++;
    delayed_execution_task.schedule(delay);
 }
	