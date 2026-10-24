import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../../theme';
import * as DocumentPicker from 'expo-document-picker';

type FileInfo = {
  name: string;
  size: number;
  uri: string;
};

export default function PdfUploadScreen() {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);

  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      // Ensure all required properties exist
      if (asset && asset.uri && asset.name && typeof asset.size === 'number') {
        setSelectedFile({
          name: asset.name,
          size: asset.size,
          uri: asset.uri
        });
      }
    } catch (error) {
      console.error('Error selecting file:', error);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    // Simulate upload process
    setTimeout(() => {
      setIsUploading(false);
      // Navigate to processing screen
      router.push('/docs/process');
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PDF to Notes</Text>
        <View style={styles.placeholder} />
      </View>
      
      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.uploadArea}>
          <View style={styles.illustrationContainer}>
            <MaterialCommunityIcons 
              name="file-pdf-box" 
              size={64} 
              color={theme.colors.primary} 
            />
            <Text style={styles.uploadTitle}>Upload Your PDF</Text>
            <Text style={styles.uploadSubtitle}>
              Select a PDF file to convert into structured notes
            </Text>
          </View>
          
          {selectedFile ? (
            <View style={styles.selectedFileContainer}>
              <View style={styles.fileInfo}>
                <MaterialCommunityIcons 
                  name="file-pdf-box" 
                  size={24} 
                  color={theme.colors.primary} 
                />
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName}>{selectedFile.name}</Text>
                  <Text style={styles.fileSize}>
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => setSelectedFile(null)}
              >
                <MaterialCommunityIcons name="close" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          ) : null}
          
          <Button
            mode="contained"
            style={styles.selectButton}
            labelStyle={styles.buttonLabel}
            onPress={handleSelectFile}
            icon="file-upload"
            disabled={isUploading}
          >
            {selectedFile ? "Change File" : "Select PDF"}
          </Button>
          
          {selectedFile && (
            <Button
              mode="contained"
              style={styles.uploadButton}
              labelStyle={styles.buttonLabel}
              onPress={handleUpload}
              loading={isUploading}
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Generate Notes"}
            </Button>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: theme.colors.outline,
    borderRadius: 16,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
    width: '100%',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  fileSize: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  removeButton: {
    padding: 8,
  },
  selectButton: {
    marginTop: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    width: '100%',
  },
  uploadButton: {
    marginTop: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    width: '100%',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 4,
  },
}); 