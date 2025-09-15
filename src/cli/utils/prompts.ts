import * as p from '@clack/prompts';

export const askForGitAlias = async (alias: string) => {
  const response = await p.text({
    message: `Enter the command for the alias "${alias}":`,
    placeholder: 'git checkout feature-branch',
  });
  return response;
};

export const confirmOverride = async (alias: string) => {
  const response = await p.confirm({
    message: `The alias "${alias}" already exists. Do you want to override it?`,
  });
  return response;
};

export const chooseFromList = async (options: string[]) => {
  const response = await p.select({
    message: 'Choose an option:',
    options: options.map((option) => ({ label: option, value: option })),
  });
  return response;
};
