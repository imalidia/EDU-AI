import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, Chip, Surface, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useNotes } from '../../contexts/NotesContext';

// Available colors for note headings
const headingColors = [
  '#10B981', // Default green
  '#2563EB', // Blue
  '#9333EA', // Purple
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#EC4899', // Pink
];

export default function CreateNoteScreen() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState(headingColors[0]);
  const [isSaving, setIsSaving] = useState(false);
  const { addNote } = useNotes();

  const addTag = () => {
    if (tagInput.trim() !== '' && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSaveNote = async () => {
    // Validate the note has a title
    if (title.trim() === '') {
      Alert.alert("Error", "Please enter a title for your note");
      return;
    }

    setIsSaving(true);

    try {
      // Save the note with the NotesContext
      await addNote({
        title: title.trim(),
        content: content,
        tags: tags,
        headingColor: selectedColor,
      });
      
      Alert.alert(
        "Note Created",
        "Your note has been saved successfully!",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error creating note:', error);
      Alert.alert("Error", "Could not create note. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => router.back()}
            iconColor="#FFFFFF"
          />
          <Text style={styles.headerTitle}>Create Note</Text>
          <Button 
            mode="contained" 
            onPress={handleSaveNote} 
            style={styles.saveButton}
            buttonColor="#10B981"
            loading={isSaving}
            disabled={isSaving || title.trim() === ''}
          >
            Save
          </Button>
        </View>

        <ScrollView style={styles.content}>
          <TextInput
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            style={[styles.titleInput, { borderLeftColor: selectedColor, borderLeftWidth: 5 }]}
            placeholderTextColor="#94A3B8"
            mode="flat"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            selectionColor="#2563EB"
            textColor="#FFFFFF"
          />

          {/* Color picker for heading */}
          <View style={styles.colorPickerContainer}>
            <Text style={styles.sectionTitle}>Heading Color</Text>
            <View style={styles.colorPicker}>
              {headingColors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColorOption
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Tags section */}
          <View style={styles.tagsContainer}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                placeholder="Add a tag..."
                value={tagInput}
                onChangeText={setTagInput}
                style={styles.tagInput}
                placeholderTextColor="#94A3B8"
                mode="outlined"
                outlineColor="#2D3B54"
                activeOutlineColor="#10B981"
                textColor="#FFFFFF"
                onSubmitEditing={addTag}
                right={
                  <TextInput.Icon
                    icon="plus"
                    color="#10B981"
                    onPress={addTag}
                  />
                }
              />
            </View>
            
            <View style={styles.tagsChipContainer}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  onClose={() => removeTag(tag)}
                  style={styles.tagChip}
                  textStyle={styles.tagChipText}
                >
                  {tag}
                </Chip>
              ))}
            </View>
          </View>
          
          {/* Note content */}
          <TextInput
            placeholder="Start writing your note here..."
            value={content}
            onChangeText={setContent}
            multiline
            style={styles.contentInput}
            placeholderTextColor="#94A3B8"
            mode="outlined"
            outlineColor="#2D3B54"
            activeOutlineColor="#10B981"
            textColor="#FFFFFF"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1C',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    backgroundColor: '#141B2E',
    borderBottomWidth: 1,
    borderBottomColor: '#2D3B54',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    borderRadius: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleInput: {
    backgroundColor: '#141B2E',
    fontSize: 22,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderRadius: 8,
    borderLeftWidth: 5,
  },
  colorPickerContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColorOption: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  tagsContainer: {
    marginBottom: 16,
  },
  tagInputContainer: {
    marginBottom: 8,
  },
  tagInput: {
    backgroundColor: '#141B2E',
    height: 48,
  },
  tagsChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    backgroundColor: '#1C2A3F',
  },
  tagChipText: {
    color: '#FFFFFF',
  },
  contentInput: {
    backgroundColor: '#141B2E',
    minHeight: 300,
    padding: 16,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
}); 