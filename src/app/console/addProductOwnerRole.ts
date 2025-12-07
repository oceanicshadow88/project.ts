/* eslint-disable no-console */
export { };

import mongoose from 'mongoose';
import config from '../config/app';
import * as Role from '../model/role';
import * as Permission from '../model/permission';
import { capitalizeFirstLetter } from '../utils/helper';

const options = {
    useNewURLParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    socketTimeoutMS: 30000,
};

const createPolicies = (
    dbConnection: any,
    slug: string,
    hasCreatePolicy = true,
    hasEditPolicy = true,
    hasDeletePolicy = true,
) => {
    const permission = Permission.getModel(dbConnection);
    const name = capitalizeFirstLetter(slug.replace('-', ''));
    const policies: any[] = [];
    if (hasCreatePolicy) {
        policies.push(new permission({ slug: `add:${slug}`, description: `Add ${name}` }));
    }
    policies.push(new permission({ slug: `view:${slug}`, description: `View ${name}` }));
    if (hasEditPolicy) {
        policies.push(new permission({ slug: `edit:${slug}`, description: `Edit ${name}` }));
    }
    if (hasDeletePolicy) {
        policies.push(
            new permission({
                slug: `delete:${slug}`,
                description: `Delete ${name}`,
            }),
        );
    }
    policies.forEach((item) => item.save());

    return policies;
};

const getProductManagerPermissions = async (dbConnection: any) => {
    const [
        createProjectPolicy,
        viewProjectPolicy,
        editProjectPolicy,
        deleteProjectPolicy,
    ] = createPolicies(dbConnection, 'projects');

    const [createBoardPolicy, viewBoardPolicy, editBoardPolicy, deleteBoardPolicy] = createPolicies(
        dbConnection,
        'boards',
    );

    const [addMembersPolicy, viewMembersPolicy, editMembersPolicy, deleteMembersPolicy] =
        createPolicies(dbConnection, 'members');

    const [addRolesPolicy, viewRolesPolicy, editRolesPolicy, deleteRolesPolicy] = createPolicies(
        dbConnection,
        'roles',
    );

    const [addShortcutsPolicy, viewShortcutsPolicy, editShortcutsPolicy, deleteShortcutsPolicy] =
        createPolicies(dbConnection, 'shortcuts');

    const [addCardsPolicy, viewCardsPolicy, editCardsPolicy, deleteCardsPolicy] = createPolicies(
        dbConnection,
        'tickets',
    );

    const [viewSettingsPolicy, editSettingsPolicy] = createPolicies(
        dbConnection,
        'settings',
        false,
        true,
        false,
    );

    const [addEpicsPolicy, viewEpicsPolicy, editEpicsPolicy, deleteEpicsPolicy] = createPolicies(
        dbConnection,
        'epics',
    );

    const [addStandupPolicy, viewStandupPolicy, editStandupPolicy] = createPolicies(
        dbConnection,
        'standup',
        true,
        true,
        false,
    );

    const [addRetroPolicy, viewRetroPolicy, editRetroPolicy, deleteRetroPolicy] = createPolicies(
        dbConnection,
        'retro',
    );

    const [viewBacklogPolicy] = createPolicies(dbConnection, 'backlog', false, false, false);

    const [addSprintsPolicy, viewSprintsPolicy, editSprintsPolicy, deleteSprintsPolicy] =
        createPolicies(dbConnection, 'sprints');

    const [addCommentsPolicy, viewCommentsPolicy, editCommentsPolicy, deleteCommentsPolicy] =
        createPolicies(dbConnection, 'comments');

    return [
        viewProjectPolicy._id,
        editProjectPolicy._id,
        deleteProjectPolicy._id,
        createBoardPolicy._id,
        viewBoardPolicy._id,
        editBoardPolicy._id,
        deleteBoardPolicy._id,
        viewMembersPolicy._id,
        editMembersPolicy._id,
        deleteMembersPolicy._id,
        viewRolesPolicy._id,
        editRolesPolicy._id,
        deleteRolesPolicy._id,
        addShortcutsPolicy._id,
        viewShortcutsPolicy._id,
        editShortcutsPolicy._id,
        deleteShortcutsPolicy._id,
        addCardsPolicy._id,
        viewCardsPolicy._id,
        editCardsPolicy._id,
        deleteCardsPolicy._id,
        viewSettingsPolicy._id,
        editSettingsPolicy._id,
        addEpicsPolicy._id,
        viewEpicsPolicy._id,
        editEpicsPolicy._id,
        deleteEpicsPolicy._id,
        addStandupPolicy._id,
        viewStandupPolicy._id,
        editStandupPolicy._id,
        addRetroPolicy._id,
        viewRetroPolicy._id,
        editRetroPolicy._id,
        deleteRetroPolicy._id,
        viewBacklogPolicy._id,
        addSprintsPolicy._id,
        viewSprintsPolicy._id,
        editSprintsPolicy._id,
        deleteSprintsPolicy._id,
        addCommentsPolicy._id,
        viewCommentsPolicy._id,
        editCommentsPolicy._id,
        deleteCommentsPolicy._id,
    ];
};

const addProductOwnerRole = async (dbConnection: any) => {
    const roleModel = Role.getModel(dbConnection);

    // Check if Product Owner role already exists
    const existingRole = await roleModel.findOne({ slug: 'product-owner' });
    if (existingRole) {
        console.log('Product Owner role already exists in this database');
        return false;
    }

    // Get Product Manager role to copy permissions
    const productManagerRole = await roleModel.findOne({ slug: 'product-manager' });
    let permissions: any[] = [];

    if (productManagerRole && productManagerRole.permissions) {
        // Use existing Product Manager permissions
        permissions = productManagerRole.permissions;
    } else {
        // Create permissions if Product Manager doesn't exist
        console.log('Product Manager role not found, creating permissions...');
        permissions = await getProductManagerPermissions(dbConnection);
    }

    // Create Product Owner role
    const productOwnerRole = new roleModel({
        name: 'Product Owner',
        slug: 'product-owner',
        isPublic: true,
        permissions,
    });

    await productOwnerRole.save();
    console.log('Product Owner role created successfully');
    return true;
};

const main = async () => {
    try {
        console.log('Adding Product Owner role to global database...\n');

        const PUBLIC_DB = 'publicdb';
        const dbConnectionString = config.publicConnection.replace(PUBLIC_DB, PUBLIC_DB);

        console.log('Connecting to database...');
        const dbConnection = await mongoose.createConnection(dbConnectionString, options);

        console.log('Checking for existing Product Owner role...');
        const added = await addProductOwnerRole(dbConnection);

        if (added) {
            console.log('\n✓ Successfully added Product Owner role to global database');
        } else {
            console.log('\n⊘ Product Owner role already exists in global database');
        }

        await dbConnection.close();
        console.log('\nDone!\n');

        process.exit(0);
    } catch (error: any) {
        console.error('\n✗ Fatal error:', error.message);
        console.error(error);
        process.exit(1);
    }
};

// Run the script
main();

