import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let auth: AuthService;
  let users: jest.Mocked<Pick<UsersService, 'findByEmail' | 'create'>>;

  beforeEach(async () => {
    users = { findByEmail: jest.fn(), create: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: JwtService, useValue: { sign: () => 'signed.jwt.token' } },
      ],
    }).compile();
    auth = moduleRef.get(AuthService);
  });

  it('register hashes the password and returns a token + user', async () => {
    users.findByEmail.mockResolvedValue(null);
    users.create.mockImplementation(async (data) => ({
      id: 'u1',
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
    }) as any);

    const res = await auth.register({
      email: 'New@Example.com',
      name: 'New',
      password: 'password123',
    });

    expect(res.accessToken).toBe('signed.jwt.token');
    expect(res.user).toEqual({ id: 'u1', email: 'new@example.com', name: 'New' });
    const [{ passwordHash }] = users.create.mock.calls[0];
    expect(passwordHash).not.toBe('password123');
    expect(await bcrypt.compare('password123', passwordHash)).toBe(true);
  });

  it('register rejects a duplicate email', async () => {
    users.findByEmail.mockResolvedValue({ id: 'x' } as any);
    await expect(
      auth.register({ email: 'a@b.com', name: 'A', password: 'password123' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('login rejects a wrong password', async () => {
    users.findByEmail.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      name: 'A',
      passwordHash: await bcrypt.hash('correct-horse', 10),
    } as any);

    await expect(
      auth.login({ email: 'a@b.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
