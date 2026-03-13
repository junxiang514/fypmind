import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	SafeAreaView,
	Alert,
	ActivityIndicator,
} from 'react-native';

import { supabase } from '../../lib/supabase';

export default function ChangePasswordScreen({ navigation }) {
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleUpdatePassword = async () => {
		const nextPassword = newPassword.trim();
		const nextConfirm = confirmPassword.trim();

		if (!nextPassword || !nextConfirm) {
			Alert.alert('Missing fields', 'Please enter and confirm your new password.');
			return;
		}

		if (nextPassword.length < 6) {
			Alert.alert('Weak password', 'New password must be at least 6 characters.');
			return;
		}

		if (nextPassword !== nextConfirm) {
			Alert.alert('Password mismatch', 'Passwords do not match.');
			return;
		}

		try {
			setIsSubmitting(true);
			const { error } = await supabase.auth.updateUser({ password: nextPassword });
			if (error) {
				Alert.alert('Update failed', error.message);
				return;
			}

			Alert.alert('Success', 'Password updated. Please login again.', [
				{
					text: 'OK',
					onPress: async () => {
						await supabase.auth.signOut();
						navigation.reset({
							index: 0,
							routes: [{ name: 'Login' }],
						});
					},
				},
			]);
		} catch (error) {
			Alert.alert('Error', error?.message ?? 'Failed to update password.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.card}>
				<Text style={styles.title}>Set New Password</Text>
				<Text style={styles.subtitle}>Open the recovery link from email and set your new password.</Text>

				<Text style={styles.label}>New Password</Text>
				<TextInput
					style={styles.input}
					placeholder="Enter new password"
					value={newPassword}
					onChangeText={setNewPassword}
					secureTextEntry
					autoCapitalize="none"
				/>

				<Text style={styles.label}>Confirm New Password</Text>
				<TextInput
					style={styles.input}
					placeholder="Confirm new password"
					value={confirmPassword}
					onChangeText={setConfirmPassword}
					secureTextEntry
					autoCapitalize="none"
				/>

				<TouchableOpacity
					style={[styles.button, isSubmitting && styles.buttonDisabled]}
					onPress={handleUpdatePassword}
					disabled={isSubmitting}
				>
					{isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Update Password</Text>}
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
		justifyContent: 'center',
		padding: 24,
	},
	card: {
		backgroundColor: '#fff',
		borderRadius: 16,
		padding: 20,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#2d3a4b',
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 14,
		color: '#5a6d7b',
		marginBottom: 20,
	},
	label: {
		fontSize: 14,
		color: '#2d3a4b',
		marginBottom: 8,
		fontWeight: '500',
	},
	input: {
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 12,
		padding: 14,
		fontSize: 16,
		backgroundColor: '#f9f9f9',
		marginBottom: 14,
	},
	button: {
		backgroundColor: '#5856D6',
		padding: 14,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: 48,
		marginTop: 4,
	},
	buttonDisabled: {
		opacity: 0.7,
	},
	buttonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
});
