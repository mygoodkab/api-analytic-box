 # analytics-box-api
 <b> <h2>Camera</h2>  </b> <p>
	<b>  path  </b>  <br>
	 '/camera' -- select all camera profile <br>
	 '/camera/{id}' -- select id camera profile <br>
	 '/camera/insert' -- +auto gen id, +default feature  // insert camera profile <br>
	 '/camera/update' -- update camera profile <p>
	<b> data </b><br>
      {    <br>
        _id  : auto gen <br>
        name : string <br>
        ip   : string <br>
        mac  : string <br>
        lat  : double <br>
        long : double <br>
        featrueId : array <br>
        detail : text <br>
      } <br>
