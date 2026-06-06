function StatCard({
 title,
 value,
 subtext,
 color
}) {

 return (

  <div className="statCard">

   <p>{title}</p>

   <h1
    style={{
     color
    }}
   >
    {value}
   </h1>

   <small>
    {subtext}
   </small>

  </div>

 );

}

export default StatCard;