import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import auth, { getAuth } from '@react-native-firebase/auth';
import { Controller } from '@/interfaces/Controller';
import firestore from '@react-native-firebase/firestore';
import i18n from 'i18next';
import { Settings } from 'luxon';
import { IS_SIMULATOR_MODE, SIMULATED_CONTROLLER_SERIAL } from '@/utils/env';

const UserContext = createContext<any>({ user: undefined });

type UserWithDoc = any & {
    doc: {
        preferences?: Record<string, any>;
        lastViewedController?: string;
    };
};

const createSimulatedController = (ownerId: string): Controller => ({
    serialNumber: SIMULATED_CONTROLLER_SERIAL,
    boundUserIds: [ownerId],
    ownerIds: [ownerId],
    name: 'Simulated Controller',
    fardriverOdometer: 1420,
    odometer: 1420,
    localName: 'Simulated Controller',
    allowAnonymousBinding: true,
    preferGpsSpeed: false,
    tireWidth: 120,
    tireAspectRatio: 70,
    rimDiameter: 12,
    gearRatio: 11,
});

const UserContextProvider = ({ children }: any) => {
    const [loadingUserState, setLoadingUserState] = useState<boolean>(true);
    const [user, setUser] = useState<UserWithDoc | null>(null);
    const [loadingControllers, setLoadingControllers] =
        useState<boolean>(!IS_SIMULATOR_MODE);
    const [controllers, setControllers] = useState<Controller[]>(
        IS_SIMULATOR_MODE ? [createSimulatedController('simulated-user')] : []
    );
    const [authUser, setAuthUser] = useState<any>(undefined);

    useEffect(() => {
        const unsubscribe = auth().onAuthStateChanged(
            (firebaseUser: UserWithDoc) => {
                console.log('onAuthStateChanged - firebaseUser:', firebaseUser?.uid);
                if (!firebaseUser) {
                    setAuthUser(null);
                    return;
                }
                setAuthUser(firebaseUser);
            }
        );
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        console.log('authUser effect - authUser:', authUser?.uid);
        if (authUser === undefined) {
            console.log('authUser is undefined, returning');
            return;
        }
        if (authUser === null) {
            console.log('authUser is null, clearing user state');
            setUser(null);
            setControllers([]);
            setLoadingUserState(false);
            setLoadingControllers(false);
            return;
        }
        console.log('authUser exists, setting up Firestore listener');

        const userRef = firestore().doc(`users/${authUser.uid}`);
        const unsubscribe = userRef.onSnapshot(async (doc) => {
            if (!doc?.exists) {
                const data = {
                    createdAt: firestore.FieldValue.serverTimestamp(),
                    uid: authUser?.uid,
                    preferences: {},
                };
                try {
                    await userRef.set(data);
                    authUser.doc = data;
                } catch (error) {
                    console.error('Error adding document: ', error);
                }
            } else {
                authUser.doc = doc.data();
            }
            i18n.changeLanguage(authUser.doc?.preferences?.language || 'en');
            Settings.defaultLocale =
                authUser.doc?.preferences?.language || 'en';
            console.log('Setting user state with authUser:', authUser.uid);
            setUser(authUser);
            setLoadingUserState(false);
        });
        return () => unsubscribe();
    }, [authUser]);

    useEffect(() => {
        if (!user?.uid) {
            return;
        }
        setLoadingControllers(true);
        const subscriber = firestore()
            .collection('controllers')
            .where('boundUserIds', 'array-contains', user.uid)
            .onSnapshot((querySnapshot) => {
                if (!querySnapshot) {
                    setControllers([]);
                    setLoadingControllers(false);
                    return;
                }
                const nextControllers: Controller[] = [];
                querySnapshot.forEach((documentSnapshot) => {
                    nextControllers.push({
                        ...documentSnapshot.data(),
                    } as Controller);
                });
                setControllers(nextControllers);
                setLoadingControllers(false);
            });
        return () => subscriber();
    }, [user?.uid]);

    const setLastViewedController = useCallback(
        async (serialNumber: string) => {
            if (!serialNumber) {
                return;
            }
            if (IS_SIMULATOR_MODE) {
                setUser((prev) => {
                    if (!prev) {
                        return prev;
                    }
                    return {
                        ...prev,
                        doc: {
                            ...prev.doc,
                            lastViewedController: serialNumber,
                        },
                    };
                });
                return;
            }
            if (!user?.uid) {
                return;
            }
            await firestore()
                .doc(`users/${user.uid}`)
                .set({ lastViewedController: serialNumber }, { merge: true })
                .catch((error) => {
                    console.error('Error adding document: ', error);
                });
        },
        [user?.uid]
    );

    const saveController = useCallback(
        async (controller: Controller) => {
            if (IS_SIMULATOR_MODE) {
                setControllers((prev) => {
                    const ownerId = user?.uid || 'simulated-user';
                    const serial =
                        controller.serialNumber ||
                        `SIM-${String(prev.length + 1).padStart(4, '0')}`;
                    const nextController: Controller = {
                        ...controller,
                        serialNumber: serial,
                        boundUserIds: [ownerId],
                        ownerIds: [ownerId],
                        localName:
                            controller.localName || controller.name || serial,
                        name: controller.name || serial,
                        fardriverOdometer: controller.fardriverOdometer || 0,
                        odometer: controller.odometer || 0,
                        allowAnonymousBinding:
                            controller.allowAnonymousBinding ?? true,
                        preferGpsSpeed: controller.preferGpsSpeed ?? false,
                        tireWidth: controller.tireWidth ?? 120,
                        tireAspectRatio: controller.tireAspectRatio ?? 70,
                        rimDiameter: controller.rimDiameter ?? 12,
                        gearRatio: controller.gearRatio ?? 11,
                    };
                    return [...prev, nextController];
                });
                return;
            }
            const newController: Controller = {
                ...controller,
                localName: controller.localName,
                fardriverOdometer: 0,
                odometer: 0,
                serialNumber: controller.serialNumber,
                boundUserIds: [user?.uid],
                ownerIds: [user?.uid],
                name: controller.name || controller.serialNumber,
                allowAnonymousBinding: controller.allowAnonymousBinding,
                preferGpsSpeed: controller.preferGpsSpeed,
            };
            await firestore()
                .doc(`controllers/${newController.serialNumber}`)
                .set(newController, { merge: false })
                .catch((error) => {
                    console.error('Error adding document: ', error);
                });
        },
        [user?.uid]
    );

    const unbindController = useCallback(
        async (serialNumber: string) => {
            if (IS_SIMULATOR_MODE) {
                setControllers((prev) =>
                    prev.filter(
                        (controller) => controller.serialNumber !== serialNumber
                    )
                );
                return;
            }
            const transaction = firestore().runTransaction(
                async (transaction) => {
                    const controllerRef = firestore().doc(
                        `controllers/${serialNumber}`
                    );
                    const controllerDoc = await transaction.get(controllerRef);
                    if (!controllerDoc.exists) {
                        throw 'Controller does not exist';
                    }
                    const controllerData = controllerDoc.data();
                    if (!controllerData?.boundUserIds.includes(user?.uid)) {
                        throw 'User does not have access to this controller';
                    }
                    const newBoundUserIds = controllerData?.boundUserIds.filter(
                        (id: string) => id !== user?.uid
                    );
                    const newBoundOwnerIds = controllerData?.ownerIds.filter(
                        (id: string) => id !== user?.uid
                    );
                    if (newBoundUserIds.length === 0) {
                        transaction.delete(controllerRef);
                        return;
                    }
                    transaction.update(controllerRef, {
                        boundUserIds: newBoundUserIds,
                        ownerIds: newBoundOwnerIds,
                    });
                }
            );
            await transaction.catch((error) => {
                console.error('Error unbinding controller: ', error);
            });
        },
        [user?.uid]
    );

    const updateController = useCallback(async (controller: Controller) => {
        if (IS_SIMULATOR_MODE) {
            setControllers((prev) =>
                prev.map((existing) =>
                    existing.serialNumber === controller.serialNumber
                        ? { ...existing, ...controller }
                        : existing
                )
            );
            return;
        }
        await firestore()
            .doc(`controllers/${controller.serialNumber}`)
            .set(controller, { merge: true })
            .catch((error) => {
                console.error('Error updating document: ', error);
            });
    }, []);

    const updateLocalControllerStateById = useCallback(
        (serialNumber: string, controller: Controller) => {
            setControllers((currentControllers) =>
                currentControllers.map((existingController) =>
                    existingController.serialNumber === serialNumber
                        ? { ...existingController, ...controller }
                        : existingController
                )
            );
        },
        []
    );

    const setPreferences = useCallback(
        async (newPreferences: Record<any, any>) => {
            if (IS_SIMULATOR_MODE) {
                setUser((prev) => {
                    if (!prev) {
                        return prev;
                    }
                    const preferences = {
                        ...(prev.doc?.preferences || {}),
                        ...newPreferences,
                    };
                    return {
                        ...prev,
                        doc: {
                            ...prev.doc,
                            preferences,
                        },
                    };
                });
                return;
            }
            if (!user?.uid) {
                return;
            }
            const preferences = {
                ...(user.doc?.preferences || {}),
                ...newPreferences,
            };
            await firestore()
                .doc(`users/${user.uid}`)
                .set({ preferences }, { merge: true });
        },
        [user?.uid, user?.doc?.preferences]
    );

    const speedUnit = user?.doc?.preferences?.speedUnit;
    const prefersMph = speedUnit === 'MPH';
    const temperatureUnit = user?.doc?.preferences?.temperatureUnit;
    const prefersFahrenheit = temperatureUnit === 'F';

    const signOut = useCallback(async () => {
        if (IS_SIMULATOR_MODE) {
            setControllers([createSimulatedController('simulated-user')]);
            return;
        }
        setAuthUser(null);
        setUser(null);
        setControllers([]);
        await auth().signOut();
    }, []);

    return (
        <UserContext.Provider
            value={{
                user,
                loadingUserState,
                setUser,
                controllers,
                saveController,
                updateController,
                loadingControllers,
                updateLocalControllerStateById,
                setLastViewedController,
                setPreferences,
                prefersMph,
                prefersFahrenheit,
                speedUnit,
                temperatureUnit,
                unbindController,
                signOut,
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserContextProvider');
    }
    return context;
};

export { UserContextProvider, useUser, UserContext };
