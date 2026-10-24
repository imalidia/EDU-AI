import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Button, Card, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type AppRoute = '/docs' | '/flashcards';

type FeatureCardProps = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  description: string;
  route: AppRoute;
};

export default function HomeScreen() {
  const theme = useTheme();

  const navigateToFeature = (route: AppRoute) => {
    router.push(route as any);
  };

  const features: FeatureCardProps[] = [
    {
      icon: 'file-document-outline',
      title: 'Document Reader',
      description: 'Upload and read documents, with AI-powered summaries and notes generation.',
      route: '/docs',
    },
    {
      icon: 'cards-outline',
      title: 'Flashcards',
      description: 'Create and study flashcards to reinforce your learning and test your knowledge.',
      route: '/flashcards',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to EduAI</Text>
        <Text style={styles.subtitle}>Your AI-powered study companion</Text>
      </View>

      <Card style={styles.statisticsCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>Your Study Progress</Text>
          <View style={styles.statsRow}>
            <View style={styles.statsItem}>
              <Text style={styles.statsNumber}>0</Text>
              <Text style={styles.statsLabel}>Notes</Text>
            </View>
            <View style={styles.statsItem}>
              <Text style={styles.statsNumber}>0</Text>
              <Text style={styles.statsLabel}>Flashcards</Text>
            </View>
            <View style={styles.statsItem}>
              <Text style={styles.statsNumber}>0</Text>
              <Text style={styles.statsLabel}>Study Days</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Text style={styles.sectionTitle}>Features</Text>
      
      <View style={styles.featuresGrid}>
        {features.map((feature, index) => (
          <Card key={index} style={styles.featureCard} onPress={() => navigateToFeature(feature.route)}>
            <Card.Content style={styles.featureCardContent}>
              <MaterialCommunityIcons name={feature.icon} size={48} color={theme.colors.primary} />
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </Card.Content>
            <Card.Actions style={styles.cardActions}>
              <Button 
                mode="contained" 
                onPress={() => navigateToFeature(feature.route)}
                style={styles.featureButton}
              >
                Start
              </Button>
            </Card.Actions>
          </Card>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>EduAI v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    opacity: 0.7,
  },
  statisticsCard: {
    marginBottom: 24,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statsItem: {
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  featuresGrid: {
    marginBottom: 24,
  },
  featureCard: {
    marginBottom: 16,
    elevation: 2,
  },
  featureCardContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 8,
  },
  cardActions: {
    justifyContent: 'center',
    paddingBottom: 16,
  },
  featureButton: {
    paddingHorizontal: 24,
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  footerText: {
    opacity: 0.5,
  },
}); 