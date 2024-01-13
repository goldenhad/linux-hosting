import { Bar } from "react-chartjs-2";
import styles from "./usagestatistic.module.scss"
import { User } from "../../firebase/types/User";
import { Usage } from "../../firebase/types/Company";
import { useMemo } from "react";



const UsageStatistic = (props: { visibleYear: number, users: Array<User> }) => {
  const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const usageUser = useMemo(() => {
    return props.users 
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
              label: `Credits ${props.visibleYear}`,
              data: months.map( ( label, idx ) => {
                let sum = 0;
                usageUser.forEach( ( su: User ) => {
                  if(su.usedCredits){
                    su.usedCredits.forEach( ( usage: Usage ) => {
                      if( usage.month == idx+1 && usage.year == props.visibleYear ){
                        sum += parseFloat( ( usage.amount/1000 ).toFixed( 2 ) );
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