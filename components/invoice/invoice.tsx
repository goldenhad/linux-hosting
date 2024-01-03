import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font
} from "@react-pdf/renderer";


Font.register({
  family: "PT Sans Narrow",
  fonts: [
    { src: "https://fonts.gstatic.com/s/ptsansnarrow/v18/BngRUXNadjH0qYEzV7ab-oWlsYCByxyKeuDp.ttf" },
    { src: "https://fonts.gstatic.com/s/ptsansnarrow/v18/BngSUXNadjH0qYEzV7ab-oWlsbg95DiCUfzgRd-3.ttf", fontWeight: 700 }
  ]
});


const Invoice = () => {
  const styles = StyleSheet.create({
    page: {
      backgroundColor: "#fff",
      color: "#000",
      fontFamily: "PT Sans Narrow"
    },
    container: {
      margin: 10,
      padding: 20      
    },
    logorow: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "center"
    },
    logo: {
      width: 150,
      marginBottom: "25mm"
    },
    addressline: {
      color: "#444141",
      fontSize: "2mm",
      marginBottom: "45mm"
    },
    angebotrow: {
      fontSize: "3mm",
      color: "#5fab28",
      textTransform: "uppercase",
      marginBottom: "5mm"
    },
    invoicedescription: {
      marginBottom: "2mm",
      width: "30mm",
      fontSize: "2.8mm"
    },
    invoicedescriptionrow: {
      display: "flex",
      flexDirection: "row"
    },
    fatdesc: {
      fontWeight: 700,
      width: "15mm"
    },
    viewer: {
      width: window.innerWidth, //the pdf viewer will take up all of the width and height
      height: window.innerHeight
    }
  });


  return (
    <Document>
      <Page size="A4" style={{ backgroundColor: "#fff", color: "#000" }}>
        <View style={styles.container}>
          <View style={styles.logorow}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={"/sp_logo.png"} style={styles.logo}/>
          </View>
          <View style={styles.addressline}>
            <Text>Sugarpool GmbH | Am Weilsberg 11 | 51789 Lindlar</Text>
          </View>
          <View style={styles.angebotrow}>
            <Text>Rechnung</Text>
          </View>
          <View style={styles.invoicedescription}>
            <View style={styles.invoicedescriptionrow}><Text style={styles.fatdesc}>Datum:</Text><Text>03.01.2024</Text></View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
export default React.forwardRef( Invoice );
