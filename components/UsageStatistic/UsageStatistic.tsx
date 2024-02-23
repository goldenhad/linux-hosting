import { Bar } from "react-chartjs-2";
import styles from "./usagestatistic.module.scss"
import { User } from "../../firebase/types/User";
import { Usage } from "../../firebase/types/Company";
import { useEffect, useState } from "react";


/**
 * Statistic representing the used credits by the user depending on the year and month
 * @param props.visibleYear Year to show
 * @param props.users All users of the users company
 * @returns UsageStatistic component
 */
const UsageStatistic = (props: {
  visibleYear: number,
  users: Array<User>
}) => {
  const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const [ users, setUsers ] = useState(props.users);

  useEffect(() => {
    setUsers(props.users);
  }, [props.users])

  return(
    <div className={styles.barcontainer}>
      <Bar
        options={{
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top" as const
            },
            title: {
              display: false,
              text: "Chart.js Bar Chart"
            }
          }
        }}
        data={{
          labels:  months,
          datasets: [
            {
              label: `Nutzung ${props.visibleYear}`,
              data: months.map( ( label, idx ) => {
                let sum = 0;
                users.forEach( ( su: User ) => {
                  if(su.usedCredits){
                    su.usedCredits.forEach( ( usage: Usage ) => {
                      if( usage.month == idx+1 && usage.year == props.visibleYear ){
                        sum += parseFloat( ( usage.amount ).toFixed( 2 ) );
                      }
                    });
                  }
                })
                return sum;
              } ),
              backgroundColor: "rgba(16, 24, 40, 0.8)"
            }
          ]
        }}
      />
    </div>
  );
}

export default UsageStatistic;