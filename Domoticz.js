/* 

a:zak45
d:25/10/2022
v:1.0.0

Chataigne Module for Domoticz

*/

// Main module parameters 

  var GetDevicesList_url = "?type=command&param=devices_list";  
  var SwitchLight_url = "?type=command&param=switchlight";
  var Udevice_url = "?type=command&param=udevice";
  var createCV = false;

// increase timeout 
script.setExecutionTimeout(30);

//We create necessary entries in modules . We need HTTP and  CustomVariables.
function init()
{
	script.log("-- Custom command called init()");	
	var HTTPexist = root.modules.getItemWithName("HTTP");
	var Domoticzexist = root.modules.getItemWithName("Domoticz");
	var DomIP = local.parameters.domoticzParameters.ip.get();
	
	if (Domoticzexist){
		
		script.log("Domoticz already exist");
		
		if (DomIP == "0.0.0.0" || DomIP == "")
		{
			util.showMessageBox("Domoticz Warning !", "Domoticz IP not set", "warning", "Got it");
			
		} else {
			
			createCV = true;
			GetDevicesListCustom();
		}
		
	}
	
	var infos = util.getOSInfos(); 
	var pathApp = util.getEnvironmentVariable("LOCALAPPDATA");
	
	script.log("Hello "+infos.username);	
	script.log("We run under : "+infos.name);
	
	
	
}

// execution depend on the user response
function messageBoxCallback(id, result)
{
	script.log("Message box callback : "+id+" : "+result); 
	
	if (id=="confirmDomoticz"){
		if (result==1)
		{
			
					script.log("Domoticz callback message : "+launchresult);			
		}
	}
}

function dataEvent(data, requestURL) 
{
	script.log("From URL:"+requestURL);
	
	if (requestURL.contains(GetDevicesList_url) && createCV == 1 && data.result && data.status == "OK" && data.title == "GetDevicesList")
	{
		// we create CustomVariables
		DomoLoop();
		
	}
}
 

/*

Domoticz 

*/


// check and set required Domoticz settings
function DomoticzMain()
{
	
	
	if (local.parameters.domoticzParameters.ip.get() == "0.0.0.0")
	{
			util.showMessageBox("Domoticz Warning !", "Domoticz IP not set", "warning", "Got it");
	}

	DomIP = local.parameters.domoticzParameters.ip.get();
	DomPort = local.parameters.domoticzParameters.port.get();

	var Dom_url = "http://"+DomIP+":"+DomPort+"/json.htm";

	local.parameters.autoAdd.set(1);
	local.parameters.baseAddress.set(Dom_url);
	
}


// We loop thru all Domoticz devices and create corresponding group/CustomVariables    
function DomoLoop()
{
	script.log("Domoticz -- Devices loop");
	
	DomoticzMain();
	
	util.showMessageBox("Domoticz Info !", "We are creating Custom Variables, plz wait ....", "info", "Got it");
	script.log("We retreive all devices and create group");
	script.log("Number of device to create :" + data.result.length);
 
	for (i = 0; i < data.result.length; i++)
	{
		script.log(" ------ > we manage index  : "+i);

		var ContainerDevices = data.result[i];  
	
		script.log("Container name child of  'result': " +ContainerDevices.name);
		
		var DeviceValue = data.result[i].value;
		var DeviceName = data.result[i].name;
	
		script.log("Device IDX value : " +DeviceValue + " for this name : " + DeviceName); 
		
		
		// check if custom var group already exist, if true we only add parameter if necessary
		var CV = root.customVariables.getItemWithName(DeviceName);
		
		if (CV) 
		{
				script.log("Group already exist");
				var PV = CV.variables.getItemWithName("IDX");
				
				if (PV)
				{
						script.log("Variable IDX already exist");
					
					} else {
						
						//  create Integer variable  --> this will create a container and a parameter with the same name.
						var custvar = CV.variables.addItem("Int Parameter");
						// set value and custom name 
						var myvar = CV.variables.getItemWithName(custvar.name).getChild(custvar.name);  
						myvar.set(parseInt(DeviceValue));
						myvar.setName("IDX");	
							
				}
		 
			} else {
				
				// create group
				var custgroup = root.customVariables.addItem(); 
				// set custom name
				custgroup.setName(DeviceName);
				//  create Integer variable  --> this will create a container and a parameter with the same name.
				var custvar = custgroup.variables.addItem("Int Parameter");
				// set value and custom name 
				var myvar = custgroup.variables.getItemWithName(custvar.name).getChild(custvar.name);  
				myvar.set(parseInt(DeviceValue));
				myvar.setName("IDX");
				
			
		}

	}
}

//We get all  devices
function GetDevicesList()
{   
	script.log("-- Custom command Device List");
	createCV = false;
	
	DomoticzMain();
	
	local.parameters.autoAdd.set(1);
	local.values.setCollapsed(true);
	
	local.sendGET(GetDevicesList_url,"json","Connection: keep-alive","");
	
}



//We get all  devices and populate root.modules.domoticz.values and create CustomVariables
function GetDevicesListCustom()
{   
	script.log("-- Custom command Device List");
	createCV = true;
	
	DomoticzMain();
	
	local.parameters.autoAdd.set(0);
	local.values.setCollapsed(true);
	
	local.sendGET(GetDevicesList_url,"json","Connection: keep-alive","");
	
}


// we put a switch On or Off
function SwitchOnOff(IDX,OnOff)
{
	script.log("-- Custom command Switch OnOff IDX: " + IDX +" to " + OnOff);
	DomoticzMain();
	
	var switch_url = SwitchLight_url+"&idx=" +IDX + "&switchcmd=" + OnOff ;
	local.sendGET(switch_url,"json","Connection: keep-alive","");
	
}

// Blinds commands <Open|Close|Stop> 
function BlindsOnOff(IDX,OnOff)
{
	script.log("-- Custom command Blinds OnOff IDX: " + IDX +" to " + OnOff);
	DomoticzMain();
	
	var switch_url = SwitchLight_url+"t&idx=" +IDX + "&switchcmd=" + OnOff ;
	local.sendGET(switch_url,"json","Connection: keep-alive","");
	
}

// Set a dimmable light/selector to a certain level 
function DimmerSBL(IDX,dimmersb)
{
	script.log("-- Custom command dimmer IDX: " + IDX +" to " + dimmersb);
	DomoticzMain();
	
	var switch_url = SwitchLight_url+"&idx=" +IDX + "&switchcmd=Set%20Level&level=" + dimmersb ;
	local.sendGET(switch_url,"json","Connection: keep-alive","");
	
}


// Text command
function SensorText(IDX,texttoadd)
{
	script.log("-- Custom command Text IDX: " + IDX +" to " + texttoadd);
	DomoticzMain();
	
	var switch_url = Udevice_url+"&idx=" +IDX +"&nvalue=0&svalue=" + texttoadd ;
	local.sendGET(switch_url,"json","Connection: keep-alive","");
	
}

// Distance command
function SensorDistance(IDX,distance)
{
	script.log("-- Custom command Distance IDX: " + IDX +" to " + distance);
	DomoticzMain();
	
	var switch_url = Udevice_url+"&idx=" +IDX +"&nvalue=0&svalue=" + distance ;
	local.sendGET(switch_url,"json","Connection: keep-alive","");
	
}

// Motion command
function SensorMotion(IDX,motion)
{
	script.log("-- Custom command Motion IDX: " + IDX +" to " + motion);
	DomoticzMain();
	
	var switch_url = Udevice_url+"&idx=" +IDX +"&nvalue="+ motion + "&svalue=0.0";
	local.sendGET(switch_url,"json","Connection: keep-alive","");
	
}

// Custom command
function SensorCustom(IDX,custom)
{
	script.log("-- Custom command Custom IDX: " + IDX +" to " + custom);
	DomoticzMain();
	
	var switch_url = Udevice_url+"&idx=" +IDX +"&nvalue=0&svalue=" + custom ;
	local.sendGET(switch_url,"json","Connection: keep-alive","");
	
}

