import { StyleSheet, Text, View } from 'react-native';

export default function BillScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Split the Bill</Text>
      <Text style={styles.subtitle}>Upload a receipt and split the bill.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});